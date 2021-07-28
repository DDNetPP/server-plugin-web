#!/bin/bash

if [ ! -f lib/lib.sh ]
then
	echo "Error: lib/lib.sh not found!"
	echo "make sure you are in the root of the server repo"
	exit 1
fi

source lib/lib.sh


function ts_log() {
	echo "[$(date '+%m-%d-%Y %T')] $1"
}

ts_log "starting cpu to web script ..."

CPU_LOG=./lib/tmp/log_cpu.txt


function write_cpu_log() {
	local pid
	local delay
	pid="$(pgrep "$CFG_SRV_NAME")"
	delay=1
	ts_log "logging cpu to file pid=$pid delay=$delay ..."
	top -b -d "$delay" -p "$pid" | \
		awk -v OFS="," '$1+0>0 {
			# print strftime("%Y-%m-%d %H:%M:%S"),$NF,$9,$10;
			print strftime("%Y-%m-%d %H:%M:%S") "  " $9 "%";
			fflush()
		}' > "$CPU_LOG"
}

function upload_log() {
	# echo "[*] uploading log ..."
	if [ -f "$CPU_LOG" ]
	then
		{
			echo '<html>'
			echo '<meta http-equiv="Refresh" content="2">'
			echo '<code style="white-space: pre;">'
			echo "timestamp            cpu"
			tail "$CPU_LOG" | tac
			echo '</code>'
			echo '</html>'
		} > "$CFG_POST_LOGS_DIR"/cpu.html
		local len
		len="$(wc -l "$CPU_LOG" | cut -d' ' -f1 )"
		if [ "$len" -gt 15 ]
		then
			tail "$CPU_LOG" > "$CPU_LOG".tmp
			cat "$CPU_LOG".tmp > "$CPU_LOG"
			rm "$CPU_LOG".tmp
		fi
	fi
}
function cleanup_cpu_script() {
	ts_log "stopping cpu script ..."
	pkill -f write_cpu_log
}

trap cleanup_cpu_script EXIT

write_cpu_log &

while true;
do
	upload_log
	sleep 1
done

