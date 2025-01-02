import { satisfies } from 'compare-versions';

import features from '../data/features.json';

import { getCurrentInstance, getCurrentNodeInfo } from './store-utils';

// Non-semver(?) UA string detection
const containPixelfed = /pixelfed/i;
const notContainPixelfed = /^(?!.*pixelfed).*$/i;
const containPleroma = /pleroma/i;
const containAkkoma = /akkoma/i;
const containGTS = /gotosocial/i;
const platformFeatures = {
  '@mastodon/lists': notContainPixelfed,
  '@mastodon/filters': (v) => !(containPixelfed.test(v) || containPleroma.test(v) || containAkkoma.test(v)),
  '@mastodon/mentions': notContainPixelfed,
  '@mastodon/trending-hashtags': (v) => !(containPixelfed.test(v) || containPleroma.test(v) || containAkkoma.test(v)),
  '@mastodon/trending-links': (v) => !(containPixelfed.test(v) || containPleroma.test(v) || containAkkoma.test(v)),
  '@mastodon/post-bookmark': notContainPixelfed,
  '@mastodon/post-edit': notContainPixelfed,
  '@mastodon/profile-edit': notContainPixelfed,
  '@mastodon/profile-private-note': notContainPixelfed,
  '@pixelfed/trending': containPixelfed,
  '@pixelfed/home-include-reblogs': containPixelfed,
  '@pixelfed/global-feed': containPixelfed,
  '@pleroma/local-visibility-post': containPleroma,
  '@akkoma/local-visibility-post': containAkkoma,
  '@pleroma/list-visibility-post': containPleroma,
  '@akkoma/list-visibility-post': containAkkoma,
  '@pleroma/post-content-type': containPleroma,
  '@akkoma/post-content-type': containAkkoma,
};

const supportsCache = {};

function supports(feature) {
  try {
    let { version, domain } = getCurrentInstance();
    let softwareName = getCurrentNodeInfo()?.software?.name || 'mastodon';

    if (softwareName === 'hometown') {
      // Hometown is a Mastodon fork and inherits its features
      softwareName = 'mastodon';
    }

    const key = `${domain}-${feature}`;
    if (supportsCache[key]) return supportsCache[key];
    
    const platformFeature = platformFeatures[feature];
    if (platformFeature instanceof Function) {
      return (supportsCache[key] = platformFeature(version));
    }
    else if(platformFeature !== undefined) {
      return (supportsCache[key] = platformFeature.test(version));
    }

    const range = features[feature];
    if (!range) return false;

    // '@mastodon/blah' => 'mastodon'
    const featureSoftware = feature.match(/^@([a-z]+)\//)[1];

    const doesSoftwareMatch = featureSoftware === softwareName.toLowerCase();
    return (supportsCache[key] =
      doesSoftwareMatch &&
      satisfies(version, range, {
        includePrerelease: true,
        loose: true,
      }));
  } catch (e) {
    return false;
  }
}

export default supports;
