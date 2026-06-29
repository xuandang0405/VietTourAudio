import { useEffect } from 'react';

export function useOnboarding(targetStepContext) {
  useEffect(() => {
    // Add safe fallbacks inside the onboarding sequence node extraction logic:
    const imageNode = targetStepContext?.getImageNode ? targetStepContext.getImageNode() : null;
    if (!imageNode) {
      console.warn("[UI Guard]: Onboarding image node context is missing, skipping frame injection safely.");
    }
  }, [targetStepContext]);
}
