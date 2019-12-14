FROM php:7.3-apache
# Update package lists
RUN apt-get update
RUN mkdir -p /usr/share/man/man1
# Install php-zip
RUN apt-get install -y libzip-dev zip
RUN docker-php-ext-configure zip --with-libzip
RUN docker-php-ext-install zip
# Install git
RUN apt-get install -y git
# Install supervisor
RUN apt-get install -y supervisor
# Copy configuration files
COPY configuration/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY configuration/update.sh /update.sh
# Copy Webappify to /var/www/html
COPY src /var/www/html
# Change ownership of /var/www
RUN chown www-data /var/www/ -R
# Change permissions of /var/www
RUN chmod 775 /var/www/ -R
# Enable mods
RUN a2enmod headers
# Startup command
CMD ["supervisord"]