require "active_storage/service"
require "base64"
require "digest"
require "faraday"
require "openssl"
require "time"

module ActiveStorage
  class Service::AzureBlobService < Service
    API_VERSION = "2021-12-02"

    def initialize(storage_account_name:, storage_access_key:, container:, public: false, endpoint_suffix: "blob.core.windows.net", **)
      @account_name = storage_account_name.to_s
      @access_key = storage_access_key.to_s
      @container = container.to_s
      @endpoint = "https://#{@account_name}.#{endpoint_suffix}"
      @public = public
      @connection = Faraday.new(url: @endpoint) { |config| config.response :raise_error }
    end

    def upload(key, io, checksum: nil, content_type: nil, **)
      body = io.respond_to?(:read) ? io.read : io.to_s
      headers = { "x-ms-blob-type" => "BlockBlob", "Content-Type" => content_type.presence || "application/octet-stream" }
      headers["Content-MD5"] = Base64.strict_encode64(Digest::MD5.digest(body))
      response = request(:put, key, body: body, headers: headers)
      verify_checksum!(body, checksum) if checksum
      response
    end

    def download(key, &block)
      response = request(:get, key)
      return response.body.each_line(&block) if block

      response.body.force_encoding(Encoding::BINARY)
    rescue Faraday::ResourceNotFound
      raise ActiveStorage::FileNotFoundError
    end

    def download_chunk(key, range)
      response = request(:get, key, headers: { "Range" => "bytes=#{range.begin}-#{range.exclude_end? ? range.end - 1 : range.end}" })
      response.body.force_encoding(Encoding::BINARY)
    rescue Faraday::ResourceNotFound
      raise ActiveStorage::FileNotFoundError
    end

    def delete(key)
      request(:delete, key)
    rescue Faraday::ResourceNotFound
      nil
    end

    def delete_prefixed(prefix)
      raise NotImplementedError, "Azure prefix deletion requires a lifecycle job"
    end

    def exist?(key)
      request(:head, key)
      true
    rescue Faraday::ResourceNotFound
      false
    end

    private

    def private_url(key, expires_in:, filename:, disposition:, content_type:, **)
      # Keep blobs private by default. A signed SAS URL can be added once the
      # client supplies the production storage policy; API download routes can
      # proxy this URL without exposing the account key.
      blob_url(key)
    end

    def public_url(key, **)
      blob_url(key)
    end

    def blob_url(key)
      "#{@endpoint}/#{@container}/#{escaped_key(key)}"
    end

    def request(method, key, body: nil, headers: {})
      timestamp = Time.now.utc.httpdate
      all_headers = {
        "x-ms-date" => timestamp,
        "x-ms-version" => API_VERSION,
        "Content-Length" => body ? body.bytesize.to_s : "0",
        **headers
      }
      all_headers["Authorization"] = authorization(method.to_s.upcase, key, all_headers)
      @connection.public_send(method, "/#{@container}/#{escaped_key(key)}") do |request|
        request.headers.update(all_headers)
        request.body = body if body
      end
    end

    def authorization(method, key, headers)
      canonical_headers = headers.select { |name, _| name.downcase.start_with?("x-ms-") }
                              .sort_by { |name, _| name.downcase }
                              .map { |name, value| "#{name.downcase}:#{value.to_s.strip}" }
                              .join("\n")
      content_length = headers["Content-Length"].to_s == "0" ? "" : headers["Content-Length"].to_s
      string_to_sign = [ method, "", "", content_length, headers["Content-MD5"].to_s,
                         headers["Content-Type"].to_s, "", "", "", "", "", "", canonical_headers,
                         "/#{@account_name}/#{@container}/#{escaped_key(key)}" ].join("\n")
      digest = OpenSSL::HMAC.digest("sha256", Base64.decode64(@access_key), string_to_sign)
      "SharedKey #{@account_name}:#{Base64.strict_encode64(digest)}"
    end

    def escaped_key(key)
      key.to_s.split("/").map { |part| ERB::Util.url_encode(part) }.join("/")
    end

    def verify_checksum!(body, checksum)
      return if Base64.strict_encode64(Digest::MD5.digest(body)) == checksum

      raise ActiveStorage::IntegrityError
    end
  end
end
