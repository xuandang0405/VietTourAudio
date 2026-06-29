export function getOnboardingImageNode(targetStepContext) {
  // Add safe fallbacks inside the onboarding sequence node extraction logic:
  const imageNode = targetStepContext?.getImageNode ? targetStepContext.getImageNode() : null;
  if (!imageNode) {
    console.warn("[UI Guard]: Onboarding image node context is missing, skipping frame injection safely.");
  }
  return imageNode;
}
