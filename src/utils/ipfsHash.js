/**
 * JavaScript implementation of the hash function used by IPFS.
 *
 * Adapted from https://ethereum.stackexchange.com/questions/44506/ipfs-hash-algorithm
 */

import crypto from 'crypto';
import bs58 from 'bs58';

export function ipfsHash(data) {
  const hashFunction = Buffer.from('12', 'hex')
  const digest = crypto.createHash('sha256').update(data).digest()
  const digestSize = Buffer.from(digest.byteLength.toString(16), 'hex')
  const combined = Buffer.concat([hashFunction, digestSize, digest])
  const multihash = bs58.encode(combined)
  return multihash
}

export function ipfsHashToUint(hash) {
  let a = bs58.decode(hash).slice(2)
  return '0x' + Buffer.from(a).toString('hex')
}
