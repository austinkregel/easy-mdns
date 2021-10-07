# Easy mDNS
I've been wanting an easy way to setup mDNS servers for all the raspberry pis and virutal machines in my house to help me better know what's where without needing to also create dns entries.

### Configuration
By default this will look for a config named `.mdns-bonjour-autobroadcast-config.yml` in the user's home directory. If you can't find the file after you've ran this once ensure you have toggled the hidden file view.

This package uses [`bonjour`](https://github.com/watson/bonjour) under the hood and passes the options from the yml direclty to [bonjour](https://github.com/watson/bonjour), so to link to their docs...

> Options are:
>
> - `name` (string)
> - `host` (string, optional) - defaults to local hostname
> - `port` (number)
> - `type` (string)
> - `subtypes` (array of strings, optional)
> - `protocol` (string, optional) - `udp` or `tcp` (default)
> - `txt` (object, optional) - a key/value object to broadcast as the TXT record
> 
> IANA maintains a [list of official service types and port numbers](http://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml).

```ts
interface ServiceOptions {
    name: string;
    host?: string | undefined;
    port: number;
    type: string;
    subtypes?: string[] | undefined;
    protocol?: 'udp'|'tcp' | undefined;
    txt?: { [key: string]: string } | undefined;
    probe?: boolean | undefined;
}
```

Example in YAML:
```yml
- name: using-every-option
  host: 192.168.1.102
  type: https
  port: 8006
  subtypes:
    http
    proxmox
  protocol: tcp
  txt: 
    name: "Proxmox Cluster 1"
    link: "https://192.168.1.101:8006"
    updates_available: true
  probe: false

- name: using-every-option
  host: 192.168.1.102
  type: ssh
  port: 22
  protocol: tcp

- name: terbium
  host: 192.168.1.101
  type: ssh
  port: 22
  protocol: tcp

- name: terbium
  host: 192.168.1.101
  type: udp
  port: 42001
  txt:
    serial: /dev/tty0
    status: online
    temp: 87
    humidity: 61
```


If you pass a `config=/absolute/file/path` with the `easy-mdns` command it'll load the config from that file instead of the home directory. 
```
easy-mdns --config=/etc/mdns/config.yml
```

Lastly, **this will include a file watcher** so any changes made to the file will cause easy-mdns to unpublish the services and republish based on the changed made to the config. This means you can have other programs manipulate the config file and the changes will be automatically published through mdns.

----
Helpful file stubs

`supervisord`
```
[program:easy-mdns]
user=root
command=/usr/bin/node /usr/bin/easy-mdns
stderr_logfile = /var/log/easy-mdns/stderr.log
stdout_logfile = /var/log/easy-mdns/stdout.log
```

Using `forever`
```
npm install -g forever
forever start /usr/bin/easy-mdns
```