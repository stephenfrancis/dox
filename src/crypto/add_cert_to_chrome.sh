
# sudo apt-get install libnss3-tools

certutil -d sql:$HOME/.pki/nssdb -A -t "P,," -n LucidiumCertificate -i cert.crt
