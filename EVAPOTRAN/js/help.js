// Documentation links
const DOCS_BASE_URL = 'https://evapotran-doc.flaha.org';

function openDocumentation(topic) {
    let url;
    
    switch(topic) {
        case 'calculator':
            url = `${DOCS_BASE_URL}/user-guide/manual-calculator/`;
            break;
        case 'epw':
            url = `${DOCS_BASE_URL}/user-guide/epw-import/`;
            break;
        case 'weather':
            url = `${DOCS_BASE_URL}/user-guide/live-weather/`;
            break;
        default:
            url = DOCS_BASE_URL;
    }
    
    window.open(url, '_blank');
}
