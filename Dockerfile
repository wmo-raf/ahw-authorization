FROM node:12-bullseye

ENV NAME ahw-auth
ENV USER microservice

RUN apt-get update -y && apt-get upgrade -y && \
    apt-get install -y bash git ssh python3 make

RUN addgroup $USER && useradd -ms /bin/bash $USER -g $USER
RUN yarn global add bunyan

RUN mkdir -p /opt/$NAME
COPY --chown=$USER:$USER package.json /opt/$NAME/package.json
COPY --chown=$USER:$USER yarn.lock /opt/$NAME/yarn.lock
RUN cd /opt/$NAME && yarn

COPY --chown=$USER:$USER entrypoint.sh /opt/$NAME/entrypoint.sh
COPY --chown=$USER:$USER tsconfig.json /opt/$NAME/tsconfig.json
COPY --chown=$USER:$USER config /opt/$NAME/config
COPY --chown=$USER:$USER ./src /opt/$NAME/src

WORKDIR /opt/$NAME

# Tell Docker we are going to use this ports
EXPOSE 3001

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

USER $USER

ENTRYPOINT ["./entrypoint.sh"]

CMD /wait
