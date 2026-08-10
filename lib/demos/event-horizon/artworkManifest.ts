import manifestJson from "@/lib/demos/event-horizon/artwork.manifest.json";
import {
  setEventArtworkManifest,
  type EventArtworkManifest,
} from "@/lib/demos/event-horizon/artworkCache";

const manifest = manifestJson as EventArtworkManifest;
setEventArtworkManifest(manifest);

export { manifest as eventArtworkManifest };
