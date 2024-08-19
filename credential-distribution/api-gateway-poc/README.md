# Motivation
This PoC should act as an example how to use an API Gateway in front of Konnektor in order to provide a setup allowing multiple clients with dedicated credentials to access the Konnektor. This makes it possible to restrict access to the Konnektor for dedicated parts of the API.

![Overview](http://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/gematik/app-Authenticator/master/api-gw-poc/api-gw-components.puml)

# API-Gateway
There are several API-Gateways available on the market. 
This PoC uses the [Apache APISIX](https://apisix.apache.org/) as an example. It is based on an NGINX reverse proxy. It can run standalone or in a [docker container](https://apisix.apache.org/docs/docker/manual/). It has a restful API for configuration or can be configured by means of a configuration file.

There are several [plugins](https://apisix.apache.org/docs/apisix/plugins/response-rewrite/) available for [Apache APISIX](https://apisix.apache.org/) in order to build rules for processing, forwarding and transforming API requests. This can be used to pass only allowed API requests to Konnektor.

# Example setup
This example setup uses [Apache APISIX](https://apisix.apache.org/) running in a docker container configured by a yaml configuration file.

![APSIX config](apsix-config.svg)

## Prerequisites
* You need to add a DNS entry for `127.0.0.1 kongateway.de` in your system, e.g. in /etc/hosts.
* [Example Configuration File](./apisix.yaml) -> Adjust the URLs and credentials in the file to yours. 

Remember, docker requires absolute paths for bind mounts.

Adjust the paths <ABSOLUTE-PATH-TO-THE-APISIX.YAML> to your apisix.yaml.

```bash docker command
docker run -d --name apisix -p 9443:9443 -p 9180:9180 -e APISIX_STAND_ALONE=true -e ALLOW_NONE_AUTHENTICATION=yes -d -v <ABSOLUTE-PATH-TO-THE-APISIX.YAML>:/usr/local/apisix/conf/apisix.yaml apache/apisix
```

As soon as docker container started you should be able to send requests:

```bash curl command to send requests to APISIX gateway
curl --resolve "kongateway.de:9443:127.0.0.1" https://kongateway.de:9443/connector.sds -v -k
```
## Troubleshooting
If the connection does not work, check the docker logs for errors via
```bash docker logs
docker logs -f apisix
```
It is crucial, that the apisix.yaml is correctly transferred to the container. To make sure, do the following
```bash check the configuration file in the container
docker exec -it apisix bash
cat /usr/local/apisix/conf/apisix.yaml 
```