# OmniLab

Ứng dụng đọc/học đa lĩnh vực (Kiến trúc hệ thống, Tài chính), UI kiểu iOS,
build bằng [Astro](https://astro.build) (static output), nội dung MDX +
content collections. Xem chi tiết ở [kế hoạch triển khai](./plans/260928-1725-omnilab-v1-learning-app/plan.md).

## Yêu cầu

- Node.js ≥ 24 (xem `.node-version`)
- pnpm 9.15.4 (`packageManager` field trong `package.json`)

## Lệnh

```bash
pnpm install       # cài dependencies
pnpm dev           # dev server (localhost:4321)
pnpm build         # build tĩnh ra dist/
pnpm preview       # preview bản build
pnpm check         # typecheck (astro check)
```

## Deploy

Repo build tĩnh, dùng [Railpack](https://railpack.com) + Caddy, deploy trên
Vibe Deploy Nhân Hòa (tự thực hiện bởi người dùng — domain, TLS, git remote).
Xem [`docs/deployment-guide.md`](./docs/deployment-guide.md) để biết env
khuyến nghị và checklist smoke test sau deploy.

## Kế hoạch & tiến độ

Chi tiết từng phase, quyết định thiết kế, và acceptance criteria nằm ở
[`plans/260928-1725-omnilab-v1-learning-app/`](./plans/260928-1725-omnilab-v1-learning-app/).
