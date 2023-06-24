## VerseEngine example bundling test

[VerseEngine](https://github.com/VerseEngine) を試しに動かしてみた

本家だと import-map 使っていたので、往年の bundling する形でもできるかどうか試してみたかった

## デプロイ手順

1. ビルドする

```command
pnpm build
```

2. サーバに dist フォルダをコピー

```command
scp -r ./dist/* server:/staging_dir/
```

3. assets フォルダを上書きコピー

```command
scp -r ./assets/* server:/staging_dir/assets/
```

4. 必要に応じて chown して webroot にコピーする

```command
sudo chown -R root:root /staging_dir/
sudo cp -r /staging_dir/* /var/www/html/
```
