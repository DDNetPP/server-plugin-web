#!/bin/bash

if [ ! -f lib/lib.sh ]
then
	echo "Error: lib/lib.sh not found!"
	echo "make sure you are in the root of the server repo"
	exit 1
fi

source lib/lib.sh

function get_cpu() {
	local pid
	local pids=0
	printf '[['
	for pid in $(pgrep -f "$CFG_BIN")
	do
		pids="$((pids+1))"
		printf '%s%d, "%s"' \
			"$([ "$pids" -gt "1" ] && printf '], [')" \
			"$pid" \
			"$(top -b -n 2 -d 0.2 -p "$pid" | tail -1 | awk '{print $9}')"
	done
	printf ']'
	if [ "$pids" -eq "0" ]
	then
		printf ', [0, "'
		if [ "$1" == "--script" ]
		then
			printf "process '%s' not found" "$CFG_BIN"
		else
			err -n "process $(tput bold)$CFG_BIN$(tput sgr0) not found"
		fi
		printf '"]]'
		return
	fi
	printf ']'
}

get_cpu "$1"

