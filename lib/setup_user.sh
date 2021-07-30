#!/bin/bash

if [ ! -f lib/lib.sh ]
then
	echo "Error: lib/lib.sh not found!"
	echo "make sure you are in the root of the server repo"
	exit 1
fi

source lib/lib.sh

if [ "$USER" != "$CFG_UNIX_USER" ]
then
	echo "[-] Error: this script has to be run as user $CFG_UNIX_USER"
	exit 1
fi

function show_help() {
	echo "usage: ./setup_user.sh [OPTION]"
	echo "description:"
	echo "  make sure to run ./setup_sudo.sh first once to setup things"
	echo "  then this script will run the node server and setup the website"
	echo "  use the -r arg to update"
	echo "options:"
	echo "  -r | --restart 		force restart running server"
}

arg_force_restart=0
for arg in "$@"
do
	if [ "$arg" == "-r" ] || [ "$arg" == "--restart" ]
	then
		arg_force_restart=1
	elif [ "$arg" == "-h" ] || [ "$arg" == "--help" ]
	then
		show_help
		exit 0
	else
		err "Unknown argument see --help"
		exit
	fi
done

function setup_cpu_logger() {
	echo "[!] WARNING: THIS CPU LOGGER IS DEPRECATED BY THE NODE APP VERSION"
	if pgrep -f "SCREEN -AmdS cpu_logger_$SRV_NAME .*cpu_to_web.sh" > /dev/null
	then
		if [ "$arg_force_restart" == "1" ]
		then
			log "stoppging cpu logger ..."
			pkill -f "SCREEN -AmdS cpu_logger_$SRV_NAME .*cpu_to_web.sh"
		else
			return
		fi
	fi
	(
		echo "[*] starting cpu logger ..."
		cd "$SCRIPT_ROOT" || exit 1
		screen -AmdS cpu_logger_"$CFG_SRV_NAME" ./lib/plugins/server-plugin-web/cpu_to_web.sh
	)
}

function setup_node_api_server() {
	if pgrep -f "SCREEN -AmdS node_api_server_$CFG_SRV_NAME .*index.js" > /dev/null
	then
		if [ "$arg_force_restart" == "1" ]
		then
			log "stopping node api server ..."
			pkill -f "SCREEN -AmdS node_api_server_$CFG_SRV_NAME .*index.js"
		else
			return
		fi
	fi
	if [ ! -x "$(command -v npm)" ]
	then
		echo "[-] Error: missing dependency npm"
		return
	fi
	if [ ! -x "$(command -v node)" ]
	then
		echo "[-] Error: missing dependency node"
		return
	fi
	if [ "$CFG_POST_LOGS_DIR" == "" ]
	then
		echo "[-] Error: CFG_POST_LOGS_DIR is empty"
		exit 1
	fi
	if [ ! -d "$CFG_POST_LOGS_DIR" ]
	then
		echo "[-] Error: CFG_POST_LOGS_DIR is not a valid directory ($CFG_POST_LOGS_DIR)"
		exit 1
	fi
	(
		echo "[*] starting cpu logger (node app) ..."
		echo "logdir=$CFG_POST_LOGS_DIR"
		cd "$SCRIPT_ROOT" || exit 1
		screen -AmdS node_api_server_"$CFG_SRV_NAME" sh -c "PL_WEB_API_TOKEN=$CFG_PL_WEB_API_TOKEN node ./lib/plugins/server-plugin-web/index.js"
		echo "[*] building frontend ..."
		cd ./lib/plugins/server-plugin-web/frontend || exit 1
		npm install
		cp \
			./node_modules/chart.js/dist/Chart.min.js \
			"$CFG_POST_LOGS_DIR"/node_modules/chart.js/dist
		cp ./*.html "$CFG_POST_LOGS_DIR"
		cp css/*.css "$CFG_POST_LOGS_DIR"/css
		cp js/*.js "$CFG_POST_LOGS_DIR"/js
		sed  "s/__CFG_SRV_NAME__/$(echo "$CFG_SRV_NAME" | sed 's/\//\\\//g')/g" js/cpu.js > "$CFG_POST_LOGS_DIR"/js/cpu.js
		sed -e "s/__CFG_PL_WEB_API_HOST__/$(echo "$CFG_PL_WEB_API_HOST" | sed 's/\//\\\//g')/g" \
			-e "s/__CFG_PL_WEB_API_TOKEN__/$(echo "$CFG_PL_WEB_API_TOKEN" | sed 's/\//\\\//g')/g" js/main.js > "$CFG_POST_LOGS_DIR"/js/main.js
	)
}

function install_gprof() {
	if [ ! -x "$(command -v gprof2dot)" ]
	then
		if [ -f ~/.local/bin/gprof2dot ]
		then
			echo "[!] Warning gprof2dot is installed but not in PATH"
			return
		fi
		python3 -m pip install --user gprof2dot
	fi
}

# setup_cpu_logger
setup_node_api_server
install_gprof
