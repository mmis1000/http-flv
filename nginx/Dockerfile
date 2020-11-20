FROM nginx:1.19.4-alpine

ENV NGINX_HTTP_FLV_MODULE_VERSION 1.2.8
ENV NGINX_ECHO_MODULE_VERSION 0.62 

RUN CONFIG="\
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --modules-path=/usr/lib/nginx/modules \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/run/nginx.lock \
    --user=nginx \
    --group=nginx \
    --with-compat \
    " \
    && apk add --no-cache --virtual .build-deps gcc libc-dev make zlib-dev openssl-dev pcre-dev curl \
    # nginx prepare
    && curl -fSL https://nginx.org/download/nginx-$NGINX_VERSION.tar.gz -o nginx.tar.gz \
    && mkdir -p /usr/src /var/www /etc/nginx/conf.d/http /etc/nginx/conf.d/rtmp /tmp/hls /tmp/dash \
    && tar -zxC /usr/src -f nginx.tar.gz \
    # nginx-http-flv-module prepare
    && curl -fSL https://github.com/winshining/nginx-http-flv-module/archive/v$NGINX_HTTP_FLV_MODULE_VERSION.zip -o nginx-http-flv-module.zip \
    && unzip nginx-http-flv-module.zip -q -d /usr/src \
    # echo-nginx-modul prepare
    && curl -fSL https://github.com/openresty/echo-nginx-module/archive/v$NGINX_ECHO_MODULE_VERSION.zip -o echo-nginx-module.zip \
    && unzip echo-nginx-module.zip -q -d /usr/src \
    # nginx build
    && rm nginx.tar.gz nginx-http-flv-module.zip echo-nginx-module.zip \
    && cd /usr/src/nginx-$NGINX_VERSION \
    && ./configure $CONFIG --add-dynamic-module=/usr/src/nginx-http-flv-module-$NGINX_HTTP_FLV_MODULE_VERSION --add-dynamic-module=/usr/src/echo-nginx-module-$NGINX_ECHO_MODULE_VERSION \
    && make modules \
    && cp /usr/src/nginx-http-flv-module-$NGINX_HTTP_FLV_MODULE_VERSION/stat.xsl /var/www \
    && cp objs/ngx_http_flv_live_module.so objs/ngx_http_echo_module.so /usr/lib/nginx/modules \
    && strip /usr/lib/nginx/modules/ngx_http_flv_live_module.so \
    && strip /usr/lib/nginx/modules/ngx_http_echo_module.so \
    # && rm -rf /usr/src/nginx-$NGINX_VERSION /usr/src/nginx-http-flv-module-$NGINX_HTTP_FLV_MODULE_VERSION /usr/src/echo-nginx-module-$NGINX_ECHO_MODULE_VERSION \
    && apk del .build-deps

COPY cert_key     /etc/nginx/ssl/
COPY nginx.conf   /etc/nginx/nginx.conf
COPY js/hls.js    /etc/nginx/hls.js
COPY conf.d/      /etc/nginx/conf.d/
COPY www/         /var/www/

EXPOSE 80 1935
