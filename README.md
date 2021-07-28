# server-plugin-web

Web interface plugin to show current network traffic and cpu usage

### dependencies

web server (nginx, apache2 or anything else that can serve simple static http files)

### setup on a new vps

login as teeworlds user such as ``teeworlds`` on the vps

```
cd
git clone git@github.com:DDNetPP/server myserver
cd myserver/lib
mkdir -p plugins && cd plugins
git clone git@github.com:DDNetPP/server-plugin-web
```

Set the ``post_logs_dir`` config in your ``server.cnf`` to a path that gets served by a webserver.


login as a sudo privileged user like ``chiller``

```
cd /home/teeworlds/myserver/
./lib/plugins/server-plugin-web/setup_sudo.sh
```

login as ``teeworlds`` again

```
cd /home/teeworlds/myserver/
./lib/plugins/server-plugin-web/setup_user.sh
```

### updating

login as ``teeworlds`` user

```
cd /home/teeworlds/myserver/lib/plugins/server-plugin-web
git pull
./setup_user.sh
```

