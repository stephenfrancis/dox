
# Installing Localhost Certificate

## For Ubuntu

1. `sudo apt-get install libnss3-tools`
2. `./show_certs_installed_into_chrome.sh` - should show nothing
3. `./add_cert_to_chrome.sh` - should output nothing
4. `./show_certs_installed_into_chrome.sh` - should show "LucidiumCertificate                                          P,,"

