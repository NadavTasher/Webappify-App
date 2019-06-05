# Webappify.org
The one-stop webapp platform

#### Special installation instructions:
Add this line to `<VirtualHost>`
```
AccessFileName .applock .htaccess
```

Add these lines to crontab:
```
0 8 * * * cd /directory/home/scripts/host && php update.php
0 8 * * * cd /directory/home/scripts/host && php renew.php
```