# Motivation
 This repository shows a simple set up for a facade implementation with re-authentication.

## Components
* server
* nginx
* client call

# Requirements
* python (tested with version 3.12.2)
* nginx (tested with version 1.25.4)

# Server
1) Create a Virtual Environment for Python

`python3 -m venv venv`

2) Install Flask

`pip3 install flask`

3) Activate the virtual environment for python

`source venv/bin/activate`

4) Create Private Key

`openssl genrsa -aes256 -out server.key 2048`

5) Create Certificate Signing Request

`openssl req -new -key server.key -out server.csr`

6) Create the Certificate

`openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt`

7) Start the server

`python server.py`

8) Test the server

`curl https://127.0.0.1:5000/unsecured --insecure`

9) Test passing an API Key

`curl https://localhost:5000/secured -H "X-API-Key:TEST-API-KEY" --insecure`

# NGINX
Apply the right configuration, found in this repository in `nginx.conf`
On MacOS it is located in `/usr/local/etc/nginx`

## Create Certificates and Adjust NGINX Configuration

1) Create Private Key

`openssl genrsa -aes256 -out server.key 2048`

2) Create Certificate Signing Request

`openssl req -new -key nginx.key -out nginx.csr`

3) Create the Certificate

`openssl x509 -req -days 365 -in nginx.csr -signkey nginx.key -out nginx.crt`

4) Adjust paths in nginx.conf


5) Start nginx

`nginx`

# Start Testing

Test for forbidden on unsecured endpoint

`curl https://localhost/unsecured  --insecure`

Test for forbidden on secured endpoint with enriched credentials

`curl https://localhost/secured  --insecure`

# Troubleshooting

Beware of the nginx state. Sometimes, a reload via `nginx -s reload` is not enough. If it behaves not as expected, try `nginx -s quit` and restart using `nginx`.
