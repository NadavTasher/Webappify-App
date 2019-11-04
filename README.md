# Webappify

Webappify is an open-source application creation and deployment platform, mainly targeting web developers.

## Installation
### Method 1: Using a docker exported image
Install [docker](https://www.docker.com/) on your machine.

Download the [latest](https://github.com/NadavTasher/Webappify/releases/latest) image then use the following commands:
```bash
gunzip -c Webappify.tar.gz | docker load
docker run -p 80:80 --name webappify-container --restart unless-stopped -d webappify
```
### Method 2: Building a docker image from source
Install [docker](https://www.docker.com/) on your machine.

[Clone the repository](https://github.com/NadavTasher/Webappify/archive/master.zip) or [download the latest release](https://github.com/NadavTasher/Webappify/releases/latest), enter the extracted directory, then run the following commands:
```bash
docker build . -t webappify
docker run -p 80:80 --name webappify-container --restart unless-stopped -d webappify
```

## Usage
Open `http://address` on a computer or a phone, and start making apps!

## Contributing
Pull requests are welcome, but only for smaller changer.
For larger changes, open an issue so that we could discuss the change.

Bug reports and vulnerabilities are welcome too. 
## License
[MIT](https://choosealicense.com/licenses/mit/)