#!/bin/bash

expo build:web
web_build_return_code="$?"

echo "www.kobeswap.org" > web-build/CNAME

exit "${web_build_return_code}"
