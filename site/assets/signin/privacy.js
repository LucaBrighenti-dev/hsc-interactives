// Privacy page: site name, credit, and a still frame of the sign-in slope field behind the header.
import { SITE_NAME, SITE_CREDIT } from '../config.js';
import { mountBackground } from './background.js';

document.querySelector('[data-site-name]').textContent = SITE_NAME;
document.querySelector('[data-site-credit]').textContent = SITE_CREDIT;
document.title = `Privacy · ${SITE_NAME}`;
mountBackground(document.querySelector('[data-signin-bg]'), { static: true });
