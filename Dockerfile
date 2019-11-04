FROM php:7.3-apache
# Update package lists
RUN apt-get update
RUN mkdir -p /usr/share/man/man1
# Copy configuration files
COPY config/init.sh /init.sh
COPY config/crontab /crontab
# Configure initscript
RUN chmod +x /init.sh
# Configure crontab
RUN
# Copy Webappify to /var/www/html
COPY src /var/www/html
# Change ownership of /var/www
RUN chown www-data /var/www/ -R
# Change permissions of /var/www
RUN chmod 775 /var/www/ -R
# Enable mods
RUN a2enmod headers
# Restart webserver
RUN service apache2 restart
# Startup command
CMD "/init.sh"