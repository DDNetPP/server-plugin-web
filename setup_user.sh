#!/bin/bash

if [ "$(basename "$(pwd)")" == "server-plugin-web" ]
then
	cd ../../../
fi

./lib/plugins/server-plugin-web/lib/setup_user.sh "$@"

