#!/bin/bash
export DATABASE_URL="postgresql://moka:2193567bc54ee0a0442c820066539b36@localhost:5432/moka_db"
cd /home/malong/projects/Moka_prod/Moka_prod/projects/moka-opencode/backend
node test-constraints.js
