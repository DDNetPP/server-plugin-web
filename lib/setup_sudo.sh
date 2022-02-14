#!/bin/bash
# setup script
# run once on new vps to set up the file servers

if [ ! -f lib/lib.sh ]
then
	echo "Error: lib/lib.sh not found!"
	echo "make sure you are in the root of the server repo"
	exit 1
fi

source lib/lib.sh

groupadd=groupadd
usermod=usermod

function setup_apache_log_server() {
	local web_group="ddpp-web-$CFG_SRV_NAME"
	local web_user
	# TODO: call some lib/lib.sh check_dep func here instead
	if [ ! -x "$(command -v groupadd)" ]
	then
		if [ -f /usr/sbin/groupadd ]
		then
			groupadd=/usr/sbin/groupadd
		else
			echo "[-] Error: missing command groupadd"
			exit 1
		fi
	fi
	if [ ! -x "$(command -v usermod)" ]
	then
		if [ -f /usr/sbin/usermod ]
		then
			usermod=/usr/sbin/usermod
		else
			echo "[-] Error: missing command usermod"
			exit 1
		fi
	fi
	if [ ! -x "$(command -v sudo)" ]
	then
		echo "[-] Error: missing command sudo"
		exit 1
	fi
	if [ "$CFG_POST_LOGS_DIR" == "" ]
	then
		echo "[-] Error: CFG_POST_LOGS_DIR is empty"
		exit 1
	fi
	sudo mkdir -p "$CFG_POST_LOGS_DIR" || { err "failed to create web dir"; exit 1; }
	if [ ! -d "$CFG_POST_LOGS_DIR" ]
	then
		echo "[-] Error: CFG_POST_LOGS_DIR is not a dir ($CFG_POST_LOGS_DIR)"
		exit 1
	fi
	log "Add unix user for web dir [default=chiller]"
	read -r web_user
	if [ "$web_user" == "" ]
	then
		web_user=chiller
	fi
	if ! id "$web_user" &>/dev/null
	then
		err "user '$web_user' not found"
		exit 1
	fi
	if [ -x "$(command -v apt)" ]
	then
		sudo apt update && sudo apt upgrade
		sudo apt install apache2 graphviz python3 python3-pip
	elif [ -x "$(command -v pacman)" ]
	then
		sudo pacman -S --needed graphviz python python-pip
	fi

	sudo mkdir -p "$CFG_POST_LOGS_DIR"/node_modules/chart.js/dist
	sudo mkdir -p "$CFG_POST_LOGS_DIR"/{js,css}
	sudo touch "$CFG_POST_LOGS_DIR"/js/{chart,cpu,main,notifications,querys}.js
	sudo touch "$CFG_POST_LOGS_DIR"/css/style.css
	sudo touch "$CFG_POST_LOGS_DIR"/node_modules/chart.js/dist/Chart.min.js

	sudo touch "$CFG_POST_LOGS_DIR"/{\
crashes.txt,donations_sum.html,donations.txt,\
full_gdb.txt,log_gdb.txt,money.txt,\
ddos.txt,\
server_log.txt,\
paste.txt,raw_build.txt,status.txt,gprof.svg,\
cpu.html,querys.html}

	sudo "$groupadd" "$web_group"
	sudo "$usermod" -aG "$web_group" "$CFG_UNIX_USER"
	sudo "$usermod" -aG "$web_group" "$web_user"

	sudo chown -R "$web_user":"$web_group" "$CFG_POST_LOGS_DIR"/*
	sudo chown www-data:"$web_group" "$CFG_POST_LOGS_DIR"/
	sudo chmod 664 "$CFG_POST_LOGS_DIR"/*
	sudo chmod 664 "$CFG_POST_LOGS_DIR"/js/*
	sudo chmod 664 "$CFG_POST_LOGS_DIR"/css/*
	sudo chmod 664 "$CFG_POST_LOGS_DIR"/node_modules/chart.js/dist/*
	sudo chmod 111 "$CFG_POST_LOGS_DIR"/{node_modules,css,js}
	sudo chmod 111 "$CFG_POST_LOGS_DIR"/node_modules/chart.js/
	sudo chmod 111 "$CFG_POST_LOGS_DIR"/node_modules/chart.js/dist

	if [ ! -f "$CFG_POST_LOGS_DIR"/.htpasswd ]
	then
		echo "[*] enter web password (user $CFG_UNIX_USER)"
		while ! sudo htpasswd -c "$CFG_POST_LOGS_DIR"/.htpasswd "$CFG_UNIX_USER"
		do
			echo "[*] something went wrong try again"
			echo "[*] enter web password (user $CFG_UNIX_USER)"
		done
	fi

	if [ ! -f "$CFG_POST_LOGS_DIR"/.htaccess ]
	then
		sudo tee -a "$CFG_POST_LOGS_DIR"/.htaccess > /dev/null <<-EOT
			AuthType Basic
			AuthName "restricted area"
			AuthUserFile "$CFG_POST_LOGS_DIR/.htpasswd"
			require valid-user
		EOT
		echo "[!] enable $(tput bold)AllowOverride All$(tput sgr0) for /var/www"
		tput bold
		echo "  sudo vim /etc/apache2/apache2.conf"
		echo "  sudo systemctl restart apache2"
		tput sgr0
	fi
}

setup_apache_log_server
