export interface Scenario {
  id: string;
  company: string;
  channel: "GitHub" | "Discord";
  ref: string;
  title: string;
  author: string;
  text: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "plaid",
    company: "Plaid",
    channel: "GitHub",
    ref: "Issue #402",
    title: "Distributed memory sync timeout on 50 nodes",
    author: "dev_dan_99",
    text:
      "[GitHub] Issue #402 opened by @dev_dan_99\n" +
      "Title: Distributed memory sync timeout on 50 nodes\n\n" +
      "Running the community edition across a 50-node cluster. Memory sync between replicas times out " +
      "after ~30s under sustained write load and the leader election flaps. We need HA replication with " +
      "automatic failover before we can take this to production. Is there a supported clustering path?",
  },
  {
    id: "capitalone",
    company: "Capital One",
    channel: "Discord",
    ref: "Discord #help",
    title: "AWS GovCloud VPC peering & SAML SSO",
    author: "vpc_wrangler",
    text:
      "[Discord] #help — message from vpc_wrangler\n\n" +
      "Cloud Architect here. We're evaluating a deployment inside AWS GovCloud. Does the managed offering " +
      "support VPC peering / PrivateLink into GovCloud regions, and can we enforce SAML SSO with our IdP " +
      "plus audit logging for compliance review?",
  },
  {
    id: "stripe",
    company: "Stripe",
    channel: "GitHub",
    ref: "PR #88",
    title: "SRE team benchmarking connection pooling",
    author: "ksato-sre",
    text:
      "[GitHub] PR #88 opened by @ksato-sre\n" +
      "Title: bench: connection pooling under high concurrency\n\n" +
      "Our SRE team is benchmarking connection pooling under high concurrency (20k concurrent clients). " +
      "p99 latency spikes once the pool saturates. This PR adds a reproducible benchmark harness; " +
      "curious whether the enterprise tier ships an adaptive pooling proxy.",
  },
];
