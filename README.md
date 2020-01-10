# HTTP-FLV

## Introduction

This repo is a Docker image of [nginx-http-flv-module](https://github.com/winshining/nginx-http-flv-module), include a [flv.js](https://github.com/bilibili/flv.js) demo.

[中文说明](https://github.com/mmis1000/http-flv/blob/master/README_CN.md)

## Installation

Pull Docker image:

```shell
docker pull mmis1000/nginx-http-flv
```

Note: you can pull the `mmis1000/nginx-http-flv:dev` tag to experience the latest (in developing) nginx-http-module.

## Usage

Start nginx-http-flv server:

```shell
docker run --rm -it -p 80:80 -p 1935:1935 mmis1000/nginx-http-flv
```

Push RTMP stream to nginx-http-flv server:

```shell
ffmpeg -re -i example.mp4 -vcodec copy -acodec copy -f flv rtmp://127.0.0.1/demo/stream-1
```

Then browse [http://127.0.0.1](http://127.0.0.1), enjoy it!

You can read here for more details:

[nginx-http-flv-module](https://github.com/winshining/nginx-http-flv-module)

[nginx-rtmp-module](https://github.com/arut/nginx-rtmp-module)

[flv.js](https://github.com/bilibili/flv.js)

[docker-nginx](https://github.com/nginxinc/docker-nginx)

## Test script (optimized for delay)

```shell
ffmpeg \
  -re -fflags +genpts \
  -stream_loop -1 \
  -i 'YOUR VIDEO PATH HERE' \
  -c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -g 50 \
  -c:a aac -b:a 160k -ac 2 -ar 44100 \
  -f flv \
  -force_key_frames 'expr:gte(t,n_forced*1)' -flags +cgop \
  -vf drawtext=fontfile=roboto.ttf:text='%{localtime}':fontsize=40:fontcolor=white@0.8:x=250:y=200 \
  rtmp://127.0.0.1/demo/stream-1
```

## See also

original author: mugennsou/nginx-http-flv