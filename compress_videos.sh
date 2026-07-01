#!/bin/bash
cd /Users/adityaparihar/Documents/MYPORTFOLIO/public

VIDEOS=("ezdeekid.mp4" "blackedout.mp4" "mall_of_dehradun_paradox.mp4" "year2025.mp4" "fresherupes.mp4" "life_at_upes.MP4" "saharshstyle.mp4" "upes_reel1.mp4" "chakrata.mp4")

for v in "${VIDEOS[@]}"; do
  echo "Compressing $v..."
  # -crf 26 provides excellent quality while drastically reducing size
  # -preset medium is a good balance of compression time and file size
  # -vf scale limits max resolution to 1080p if it's 4k, otherwise keeps original
  ffmpeg -y -i "$v" -c:v libx264 -crf 26 -preset medium -c:a aac -b:a 128k -movflags +faststart -vf "scale='min(1080,iw)':-2" "opt_$v" </dev/null
  if [ $? -eq 0 ]; then
    mv "opt_$v" "$v"
    echo "Successfully compressed $v"
  else
    echo "Failed to compress $v"
    rm -f "opt_$v"
  fi
done

echo "Compression complete!"
