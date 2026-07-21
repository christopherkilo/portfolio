export type RamRecommendationInput = {
  installedGb: number;
  workload: string;
  applicationCount: number;
  gaming: boolean;
  virtualMachines: boolean;
  creativeWork: boolean;
  futureWorkload: "Similar" | "Moderately heavier" | "Significantly heavier";
};

export type RamRecommendation = {
  recommendedGb: 16 | 32 | 64;
  headline: string;
  reasoning: string;
  meetsTarget: boolean;
};

export function recommendRam(input: RamRecommendationInput): RamRecommendation {
  const intensiveWorkload = ["Video editing", "Virtual machines"].includes(input.workload);
  const advancedUse = input.virtualMachines || input.creativeWork || intensiveWorkload;
  const futurePressure = input.futureWorkload === "Significantly heavier";

  let recommendedGb: RamRecommendation["recommendedGb"] = 16;
  if (advancedUse || input.gaming || input.applicationCount > 10 || input.futureWorkload === "Moderately heavier") {
    recommendedGb = 32;
  }
  if ((advancedUse && input.applicationCount > 10) || (advancedUse && futurePressure)) {
    recommendedGb = 64;
  }

  const headline =
    recommendedGb === 64
      ? "64 GB may be appropriate for advanced workloads"
      : recommendedGb === 32
        ? "32 GB is ideal"
        : input.installedGb < 16
          ? "8 GB is functional but limited"
          : "16 GB is recommended";

  const workloadFactors = [
    input.workload.toLowerCase(),
    `approximately ${input.applicationCount} concurrent applications`,
    advancedUse ? "memory-intensive tools" : null,
    futurePressure ? "significantly heavier expected work" : null,
  ].filter(Boolean);

  return {
    recommendedGb,
    headline,
    meetsTarget: input.installedGb >= recommendedGb,
    reasoning: `${workloadFactors.join(", ")} point toward ${recommendedGb} GB for comfortable headroom.`,
  };
}
