#!/bin/env bash

sic_dir=~/bin/
irc_server="localhost"
basedir=~/src/chat/
secret_file=${basedir}secrets
chat_file_prefix=${basedir}user-

while read -ra message; do
	secret="${message[0]}"

	if [ X"${secret}" = X ]; then
		echo "# No secret. Try again."
		continue
	fi

	my_name=$(awk "\$2~/^${secret}$/ {print \$1}" "${secret_file}" 2> /dev/null)

	chat_pid_file="${chat_file_prefix}${my_name}-pid"

	if [ X"${my_name}" = X ]; then
		echo "# Bad secret. Try again."
		continue
	fi

	break
done

chat_in="${chat_file_prefix}${my_name}-in"
chat_out="${chat_file_prefix}${my_name}-out"

[ -p "${chat_in}" ] || mkfifo "${chat_in}"

# Delete any stray PID files
for process_file in $(ls ${basedir}user-*-pid* 2> /dev/null); do
	check_pid=$(cat "${process_file}")
	if [ X"${check_pid}" = X ]; then
		rm "${process_file}"
		continue
	fi
	pid_running=$(ps | awk "\$1~/^${check_pid}\$/" | wc -l)
	if [ "${pid_running}" != 1 ]; then
		rm "${process_file}"
	fi
done

if [ ! -e "${chat_pid_file}" ]; then
	${sic_dir}sic -h ${irc_server} -n "${my_name}" > "${chat_out}"  <> "${chat_in}" & # 2> /dev/null &
	chat_pid="${!}"
	echo "${chat_pid}" > "${chat_pid_file}"
	chat_running=$(ps | awk "\$1~/^${chat_pid}\$/" | wc -l)
	if [ "${chat_running}" != 1 ]; then
		rm "${chat_pid_file}"
		rm "${chat_in}"
		rm "${chat_out}"
		exit
	fi
fi

echo "${$}" > "${chat_pid_file}.${$}"
tail -f "${chat_out}" --pid "${$}" &
while IFS= read -r line; do
	linenospaces=${line// /}
	if [[ "${linenospaces,,*}" =~ ^:quit ]]; then
		break
	fi
	if [[ "${linenospaces,,*}" =~ ^:nick ]]; then
		continue
	fi
	printf '%s\n' "$line"
done > "${chat_in}"

rm "${chat_pid_file}.${$}"
count=$(ls -1 "${chat_pid_file}.*" 2> /dev/null | wc -l)
if [ "${count}" = 0 ]; then
	kill "$(cat ${chat_pid_file})"
	rm "${chat_pid_file}"
	rm "${chat_in}"
	rm "${chat_out}"
fi

