import DnaResultPage from './DnaResult';

/**
 * Public share route (`#/dna/<payload>`).
 *
 * Rendered by the same component as the owner's result page, in read-only mode.
 * The payload lives in the URL fragment and is decoded locally, so the page
 * works on a completely static host with no backend.
 */
export default function ShareView() {
  return <DnaResultPage />;
}
