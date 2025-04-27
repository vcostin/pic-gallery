-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
