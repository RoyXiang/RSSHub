请在合并上游时遵循以下规则：

1. 只有以下的 routes 需要优先维持我自己的分支实现的逻辑，其他 routes 可以直接采用上游的版本
    - `/bangumi.moe/*`
    - `/dmhy/*`
    - `/mikan/*`
    - `/nyaa/*`

2. `.github/workflows` 下之需要保留 `deploy.yml`，其他的 workflow 都可以直接删掉，然后 `deploy.yml` 里用到的 action 需要更新到最新的版本

3. `Dockerfile` 可以直接使用上游的版本，同时同步更新 `.node-version` 里的版本

4. 上面的步骤都完成之后，先不要提交修改，先完成代码的 `lint`，然后试运行一次。
