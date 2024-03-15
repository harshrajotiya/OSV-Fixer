const axios = require('axios');
const xml2js = require('xml2js');

async function getTopVersions(groupId, artifactId, count = 10) {
    const url = `https://repo1.maven.org/maven2/${groupId.replace(/\./g, '/')}/${artifactId}/maven-metadata.xml`;
    const response = await axios.get(url);
    const result = await xml2js.parseStringPromise(response.data);
    const versions = result.metadata.versioning[0].versions[0].version;
    return versions.slice(-count).reverse();
}

async function getVul(packageName, version) {
    try {
        const url = "https://api.osv.dev/v1/query";
        const data = {
            package: { name: packageName },
            version: version
        };
        const response = await axios.post(url, data);
        return response.data && response.data.vulns ? response.data.vulns.length : 0;
    } catch (error) {
        console.error(`Error fetching vulnerabilities for ${packageName}:${version}:`, error.message);
        return 0;
    }
}

async function getVersionsAndVul(groupId, artifactId, count = 10) {
    const versions = await getTopVersions(groupId, artifactId, count);

    const promises = versions.map(version => getVul(`${groupId}:${artifactId}`, version));

    const vulnerabilities = await Promise.all(promises);

    const versionsAndVul = {};
    versions.forEach((version, index) => {
        versionsAndVul[version] = vulnerabilities[index];
    });

    return versionsAndVul;
}

// getVersionsAndVul('org.yaml', 'snakeyaml', 10)
//     .then(result => console.log(result)) 
//     .catch(error => console.error('Error:', error.message));

module.exports = {
    getVersionsAndVul: getVersionsAndVul
};
