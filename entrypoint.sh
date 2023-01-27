#!/bin/bash
set -e

case "$1" in
    start)
        echo "Running Start"
        exec yarn start
        ;;
    *)
        exec "$@"
esac
