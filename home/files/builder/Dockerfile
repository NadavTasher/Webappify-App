FROM php:7.0-apache
# Copy WebApp to /var/www/html
COPY src /var/www/html
# Change ownership of /var/www
RUN chown www-data /var/www/ -R
# Change permissions of /var/www
RUN chmod 775 /var/www/ -R
# Enable mods
RUN a2enmod headers
# Restart webserver
RUN service apache2 restart