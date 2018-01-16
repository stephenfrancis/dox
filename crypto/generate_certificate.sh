## openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -days 365 -out cert.crt
openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -days 365 -out cert.crt -config gen_cert_config
