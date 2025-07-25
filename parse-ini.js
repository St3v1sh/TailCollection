function parseIni(iniString) {
    const config = {};
    let currentSection = null;
    const lines = iniString.split(/\r?\n/);

    const sectionRegex = /^\s*\[\s*([^\]]+)\s*\]\s*$/;
    const keyValueRegex = /^\s*([^=]+?)\s*=\s*(.*?)\s*$/;
    const commentRegex = /^\s*[;#]/;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (commentRegex.test(trimmedLine) || trimmedLine === '') {
            continue;
        }

        let match;
        if ((match = trimmedLine.match(sectionRegex))) {
            currentSection = match[1];
            config[currentSection] = config[currentSection] || {};
        } else if ((match = trimmedLine.match(keyValueRegex))) {
            let [, key, value] = match;
            key = key.trim();
            value = value.trim();

            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }

            const target = currentSection ? config[currentSection] : config;
            target[key] = value;
        }
    }
    return config;
}