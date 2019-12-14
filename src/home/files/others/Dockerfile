FROM php:7.3-apache
# Enable mods
RUN a2enmod headers
# Copy WebApp to /var/www/html
COPY src /var/www/html
# Change ownership of /var/www
RUN chown www-data /var/www/ -R
# Change permissions of /var/www
RUN chmod 775 /var/www/ -R