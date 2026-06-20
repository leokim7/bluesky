// 빌드 환경에서 next 가 자동 생성 — 로컬 type-check 용 stub
declare module "next" {
  export interface Metadata {
    title?: string;
    description?: string;
    icons?: { icon?: string };
  }
  export type NextConfig = Record<string, unknown>;
}
declare module "next/dynamic" {
  const dynamic: <P>(
    loader: () => Promise<{ default: React.ComponentType<P> } | React.ComponentType<P>>,
    options?: { ssr?: boolean; loading?: () => JSX.Element | null },
  ) => React.ComponentType<P>;
  export default dynamic;
}
