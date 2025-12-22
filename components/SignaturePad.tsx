'use client'

import { useEffect, useRef, useState } from 'react'
import SignatureCanvas from 'signature_pad'

interface SignaturePadProps {
  onSignatureChange: (signature: string) => void
}

export default function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(null)
  const onSignatureChangeRef = useRef(onSignatureChange)

  // Update the ref when callback changes
  useEffect(() => {
    onSignatureChangeRef.current = onSignatureChange
  }, [onSignatureChange])

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const container = canvas.parentElement
      
      // Set canvas size to match container
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = 200
      }

      const pad = new SignatureCanvas(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
      })

      pad.addEventListener('endStroke', () => {
        const dataUrl = pad.toDataURL()
        onSignatureChangeRef.current(dataUrl)
      })

      setSignaturePad(pad)

      // Handle window resize
      const handleResize = () => {
        if (container) {
          const data = pad.toData()
          canvas.width = container.clientWidth
          canvas.height = 200
          pad.clear()
          pad.fromData(data)
        }
      }

      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  const clearSignature = () => {
    if (signaturePad) {
      signaturePad.clear()
      onSignatureChange('')
    }
  }

  return (
    <div className="space-y-2">
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas ref={canvasRef} className="touch-none w-full" />
      </div>
      <button
        type="button"
        onClick={clearSignature}
        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
      >
        Clear Signature
      </button>
    </div>
  )
}

