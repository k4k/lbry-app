const CHANNEL_NAME_MIN_LEN = 4;
const CLAIM_ID_MAX_LEN = 40;

const uri = {};

/**
 * Parses a LBRY name into its component parts. Throws errors with user-friendly
 * messages for invalid names.
 * 
 * Returns a dictionary with keys:
 *   - name (string)
 *   - properName (string; strips off @ for channels)
 *   - isChannel (boolean)
 *   - claimSequence (int, if present)
 *   - bidPosition (int, if present)
 *   - claimId (string, if present)
 *   - path (string, if persent)
 */
uri.parseLbryUri = function(lbryUri, requireProto=false) {
  // Break into components.
  const componentsRegex = new RegExp(
    '^((?:lbry:\/\/)?)' + // protocol
    '([^:$#/]*)' +        // name (stops at the first separator or end)
    '([:$#]?)([^/]*)' +   // modifier separator, modifier (stops at the first path separator or end)
    '(/?)(.*)'            // path separator, path
  );

  // Convert empty or undefined sub-matches to null
  let [proto, name, modSep, modVal, pathSep, path] = componentsRegex.exec(lbryUri).slice(1).map(match => match || null);

  if (!proto && requireProto) {
    throw new Error('LBRY URIs must include a protocol prefix (lbry://)')
  }

  let claimId, claimSequence, bidPosition;
  if (modSep) {
    if (!modVal) {
      throw new Error(`No modifier provided after separator ${modSep}`)
    }

    if (modSep == '#') {
      claimId = modVal;
    } else if (modSep == ':') {
      claimSequence = modVal;
    } else if (modSep == '$') {
      bidPosition = modVal;
    }
  }

  if (!name) {
    throw new Error('URI does not include name.')
  }

  const isChannel = name[0] == '@';
  const properName = isChannel ? name.substr(1) : name;

  // Validate and process name
  if (isChannel) {
    if (!properName) {
      throw new Error('No channel name after @.');
    }

    if (properName.length < CHANNEL_NAME_MIN_LEN) {
      throw new Error(`Channel names must be at least ${CHANNEL_NAME_MIN_LEN} characters.`)
    }
  }

  const nameBadChars = properName.match(/[^A-Za-z0-9-]/g);
  if (nameBadChars) {
    throw new Error(`Invalid character${nameBadChars.length == 1 ? '' : 's'} in name: ${nameBadChars.join(', ')}`);
  }

  // Validate claim ID
  if (claimId && (claimId.length > CLAIM_ID_MAX_LEN || !claimId.match(/^[0-9a-f]+$/))) {
    throw new Error(`Invalid claim ID ${claimId}`);
  }

  // Validate bid position
  if (bidPosition && !bidPosition.match(/^-?[1-9][0-9]+$/)) {
    throw new Error('Bid position must be a number.');
  }

  // Validate claim sequence
  if (claimSequence && !claimSequence.match(/^-?[1-9][0-9]+$/)) {
    throw new Error('Claim sequence must be a number.');
  }

  // Validate path
  if (path) {
    if (!isChannel) {
      throw new Error('Only channel URIs may have a path.')
    }

    const pathBadChars = path.match(/[^A-Za-z0-9-]/g);
    if (pathBadChars) {
      throw new Error(`Invalid character${count == 1 ? '' : 's'} in path: ${nameBadChars.join(', ')}`);
    }
  } else if (pathSep) {
    throw new Error('No path provided after /');
  }
  
  return {
    name, properName, isChannel, claimSequence, bidPosition, claimId, path,
    ... claimSequence ? {claimSequence: parseInt(claimSequence)} : {},
    ... bidPosition ? {bidPosition: parseInt(bidPosition)} : {},
    ... claimId ? {claimId} : {},
    ... path ? {path} : {},
  };
}

export default uri;
