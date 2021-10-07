const bonjour = require('bonjour')()
const yaml = require('yaml')
const fs = require('fs');
const path = require('path');
const os = require('os');
const chokidar = require('chokidar');

const host = Object.values(os.networkInterfaces())
    .flat(1)
    .filter(interface => !interface.internal && interface.family === 'IPv4' && interface.netmask === '255.255.255.0')
    .map(interface => interface.cidr.replace('/24', ''))[0];

    const configOptions = process.argv.filter(option => option.includes('config'));

let filePath = path.join(os.homedir(), '/.mdns-bonjour-autobroadcast-config.yml');

if (configOptions.length > 0) { 
    filePath = configOptions.map(option => option.split('=')[1])[0];
}

if (!fs.existsSync(filePath)) {
    console.log('Creating a file at [' + filePath + ']');

    fs.writeFileSync(filePath, yaml.stringify([
        // Just a basic device config, maybe I should do more to show what's available right off the bat?
        {
            name: os.hostname(),
            host,
            type: 'ssh',
            port: 22,
        }
    ]))
}


let broadcasters = [];

const parseTheYamlConfigFile = () => {
    const data = fs.readFileSync(filePath, 'utf-8');
    try { 
        const parsedYaml = yaml.parse(data)

        return parsedYaml;
    } catch (error) {
        if (error.source) {
            const brokenLine = data.replace(data.substr(error.source.range.start, error.source.range.end), '').split("\n")[0];
            const brokenLines = data.split("\n").map((part, index) => ({
                index: index + 1,
                included: part.includes(brokenLine)
            })).filter(part => part.included);
            
            console.error("Oh no! We failed to read part of the yaml file! See line " + brokenLines[0].index)
            console.error(`It's "${brokenLine}"`)
            console.error(filePath+':'+brokenLines[0].index)    
        } else {
            console.error(error);
        }
        return null;
    }
}

const publish = () => {
    const parsedYaml = parseTheYamlConfigFile();

    broadcasters = parsedYaml.map(config => bonjour.publish({
        // Don't override the host, but if it's not set, set it.
        host,
        ...config,
    }));

    broadcasters.map(broadcaster => broadcaster.start());

    console.log(`Started ${broadcasters.length ?? 0} broadcasters`)
};

chokidar.watch(filePath).on('change', (path, stats) => {
    console.log('Config file changed! Restarting!');
    bonjour.unpublishAll(() => {
        console.log(`Killing ${broadcasters.length ?? 0} broadcasters`)
        publish()
    });
})

publish();

const unPublishAndDeleteYourself = async function() {
    bonjour.unpublishAll(() => {
        bonjour.destroy();
        console.log(`Killing ${broadcasters.length} broadcasters`)
        process.exit();
    });
};

process.on('SIGTERM', unPublishAndDeleteYourself)
process.on('SIGINT', unPublishAndDeleteYourself)
