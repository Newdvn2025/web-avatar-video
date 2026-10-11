import Foundation
import Vision
import CoreImage
import AppKit
let args=CommandLine.arguments
let input=URL(fileURLWithPath:args[1]), output=URL(fileURLWithPath:args[2])
let context=CIContext()
let files=try FileManager.default.contentsOfDirectory(at:input,includingPropertiesForKeys:nil).filter{$0.pathExtension=="png"}.sorted{$0.path<$1.path}
for file in files {
 autoreleasepool {
 do {
 let request=VNGenerateForegroundInstanceMaskRequest()
 let handler=VNImageRequestHandler(url:file)
 try handler.perform([request])
 guard let result=request.results?.first else {fatalError("No foreground")}
 let mask=try result.generateScaledMaskForImage(forInstances:result.allInstances,from:handler)
 let image=CIImage(contentsOf:file)!
 let alpha=CIImage(cvPixelBuffer:mask).applyingFilter("CIMorphologyMinimum",parameters:[kCIInputRadiusKey:2.0]).applyingFilter("CIGaussianBlur",parameters:[kCIInputRadiusKey:0.5]).cropped(to:image.extent)
 let clear=CIImage(color:.clear).cropped(to:image.extent)
 let cut=image.applyingFilter("CIBlendWithMask",parameters:[kCIInputBackgroundImageKey:clear,kCIInputMaskImageKey:alpha])
 let url=output.appendingPathComponent(file.lastPathComponent)
 try context.writePNGRepresentation(of:cut,to:url,format:.RGBA8,colorSpace:CGColorSpaceCreateDeviceRGB())
 print(file.lastPathComponent)
 } catch {print("ERROR \(file.lastPathComponent): \(error)")}
 }
}
