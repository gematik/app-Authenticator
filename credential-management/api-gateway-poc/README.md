# Motivation
As stated in the [General Motivation](../README.md), the distribution of the Konnektor credentials pose risks regarding confidentiality. The idea of this PoC is to move the credentials into a central place, where they can be protected effectively and much easier distributed. Moreover, the allowed requests to the Konnektor will also be restricted to necessary parts of the Konnektor API.

# Reverse Proxy
A reverse proxy should abstract the APIs and structure of the Konnektor entities. Therefore, it receives requests from the client machines and passes them through to a konnektor depending on certain information in the request. Furthermore, it terminates the TLS connection and establishes a new one with mTLS against the actual Konnektor.

## Regarding Certificates
Certificates are a crucial part of the security model. But they have to be used properly.
The Authenticator app validates the certificate presented by the Konnektor API when establishing the TLS connection. The validation is against a set of root certificates, that are stored in the OS or supplied in the Authenticator configuration. Using a custom PKI or self-signed certificates might require configuration of the signer certificates or intermediate certificate on the client machines.
In the worst case, the TLS validation against the Konnektor certificate can be disabled. However, we do not recommend to do this.

# Sample Configuration
Due to different authentication schemes supported by the Konnektor spec, we offer two sample configurations, one for certificate-based authentication and one for basic authentication.

## Certificate-based Authentication

Using this authentication scheme, the certificate and the private key for client authentication are required from the nginx to establish the mTLS connection. 

### Adjustments
There are several configuration data to adjust. You can find the places marked in the sample configuration file `nginx_mtls.conf`
* Konnektor URLs
* Reverse Proxy URL
* Client key (unencrypted PKCS#8) and certificates for client authentication with the Konnektor 
* Server certificates for the server authentication of the nginx towards the clients
* CA cert file from the konnektors, different CAs (from different Konnektors) are not supported in this design

Start the docker container using the following command

`docker run --name api-gateway-nginx  -p 9443:443 -v .\nginx_mtls.conf:/etc/nginx/nginx.conf:ro -v .\certificates\client-cert.pem:/etc/nginx/ssl/client-cert.pem:ro -v .\certificates\client-key.pem:/etc/nginx/ssl/client-key.pem:ro -v .\certificates\konnektor-ca-cert.pem:/etc/nginx/ssl/ca-cert.pem:ro -v .\certificates\server-cert.pem:/etc/nginx/ssl/server-cert.pem:ro -v .\certificates\server-key.pem:/etc/nginx/ssl/server-key.pem:ro --rm -d nginx`

## Basic Authentication
Using this authentication scheme, the Basic Authentication credentials needs to be supplied in the Authorization Header.

### Adjustments

There are several configuration data to adjust. You can find the places marked in the sample configuration file `nginx_basic_auth.conf`
* Konnektor URLs
* Reverse Proxy URL
* Basic Authentication credentials client authentication with the Konnektor, conversion via  `echo -n 'username:password' | base64`
* Server certificates for the server authentication of the nginx towards the clients
* CA cert file from the konnektors, different CAs (from different Konnektors) are not supported in this design

Start the docker container using the following command

`docker run --name api-gateway-nginx  -p 9443:443 -v .\nginx_mtls.conf:/etc/nginx/nginx.conf:ro -v .\certificates\client-cert.pem:/etc/nginx/ssl/client-cert.pem:ro -v .\certificates\client-key.pem:/etc/nginx/ssl/client-key.pem:ro -v .\certificates\konnektor-ca-cert.pem:/etc/nginx/ssl/ca-cert.pem:ro -v .\certificates\server-cert.pem:/etc/nginx/ssl/server-cert.pem:ro -v .\certificates\server-key.pem:/etc/nginx/ssl/server-key.pem:ro --rm -d nginx`

# Authenticator Adjustments
The Authenticator app is now required to send a custom header X-Api-Gateway.
Therefore, the app needs an environment variable 'CONNECTOR_NAME' which points to the configuration in the nginx config.

# Troubleshooting

# Check DNS resolution
We experienced problems with 502 responses from the nginx, when omitting the resolver and when the proxy in docker was activated.
In the sample files is a resolver configured

If the connection does not work, check the docker logs for errors via 
```bash docker logs
docker logs -f nginx
```

## Check Network Connection
Run the curl command to check if the Konnektor is reachable from the machine where the nginx is deployed

``` bash curl command
curl -v https://<KONNEKTOR-IP-OR-DOMAIN>/connector.sds
```
