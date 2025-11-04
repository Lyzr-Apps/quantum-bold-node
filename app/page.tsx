'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileUp, CheckCircle, AlertCircle, Home, Droplet, File, Eye, Download, Edit2, Plus, Trash2, ChevronDown, Loader2 } from 'lucide-react'

type Screen = 'landing' | 'form' | 'results'
type FormStep = 'property' | 'pool' | 'documents' | 'review'

interface PropertyInfo {
  address: string
  lotSize: string
  zoning: string
  propertyType: string
}

interface PoolInfo {
  poolType: string
  length: string
  width: string
  depth: string
  heating: boolean
  lighting: boolean
  divingBoard: boolean
  fence: boolean
  heatingType?: string
}

interface UploadedDocument {
  id: string
  name: string
  type: string
  file: File
  preview?: string
}

interface ValidationResult {
  validation_status: 'complete' | 'incomplete'
  validation_checklist: { item: string; status: 'pass' | 'fail'; details?: string }[]
  property_summary: PropertyInfo
  pool_summary: PoolInfo
  document_status: { [key: string]: { uploaded: boolean; status: string } }
  missing_items: string[]
  compliance_notes: string[]
}

const ZONING_OPTIONS = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed', label: 'Mixed Use' },
]

const PROPERTY_TYPES = [
  { value: 'single-family', label: 'Single Family Home' },
  { value: 'multi-family', label: 'Multi-Family' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
]

const FAQ_ITEMS = [
  {
    question: 'How long does the permit application process take?',
    answer: 'Typically 2-4 weeks from submission to approval, depending on your local jurisdiction and whether the application is complete.',
  },
  {
    question: 'What documents do I need for my pool permit?',
    answer: 'You will need: property deed, site plan showing setbacks, and pool design drawings with specifications.',
  },
  {
    question: 'Are there setback requirements for pools?',
    answer: 'Yes, most jurisdictions require pools to be set back from property lines. Common requirements are 5-10 feet from property lines and 25+ feet from neighbors.',
  },
  {
    question: 'Do I need a fence around my pool?',
    answer: 'Most jurisdictions require residential pools to be completely enclosed with a 4-6 foot fence with self-closing gates.',
  },
  {
    question: 'What safety features are typically required?',
    answer: 'Common requirements include: proper fencing, drain covers, emergency equipment, electrical safety, and signage.',
  },
]

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [formStep, setFormStep] = useState<FormStep>('property')
  const [loading, setLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [property, setProperty] = useState<PropertyInfo>({
    address: '123 Oak Street',
    lotSize: '0.5',
    zoning: 'residential',
    propertyType: 'single-family',
  })

  const [pool, setPool] = useState<PoolInfo>({
    poolType: 'inground',
    length: '20',
    width: '40',
    depth: '8',
    heating: false,
    lighting: false,
    divingBoard: false,
    fence: true,
    heatingType: 'gas',
  })

  const [documents, setDocuments] = useState<UploadedDocument[]>([])

  const handlePropertyChange = (field: keyof PropertyInfo, value: string) => {
    setProperty((prev) => ({ ...prev, [field]: value }))
  }

  const handlePoolChange = (field: keyof PoolInfo, value: string | boolean) => {
    setPool((prev) => ({ ...prev, [field]: value }))
  }

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          setDocuments((prev) => [
            ...prev.filter((d) => d.type !== docType),
            {
              id: Date.now().toString(),
              name: file.name,
              type: docType,
              file,
              preview: event.target?.result as string,
            },
          ])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-blue-50', 'border-blue-400')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400')
  }

  const handleDrop = (e: React.DragEvent, docType: string) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400')

    const files = e.dataTransfer.files
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          setDocuments((prev) => [
            ...prev.filter((d) => d.type !== docType),
            {
              id: Date.now().toString(),
              name: file.name,
              type: docType,
              file,
              preview: event.target?.result as string,
            },
          ])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  const validateStep = (): boolean => {
    switch (formStep) {
      case 'property':
        return !!(property.address && property.lotSize && property.zoning && property.propertyType)
      case 'pool':
        return !!(
          pool.poolType &&
          pool.length &&
          pool.width &&
          pool.depth &&
          (pool.heating ? pool.heatingType : true)
        )
      case 'documents':
        return documents.length >= 2
      case 'review':
        return true
      default:
        return false
    }
  }

  const goToNextStep = () => {
    const steps: FormStep[] = ['property', 'pool', 'documents', 'review']
    const currentIndex = steps.indexOf(formStep)
    if (currentIndex < steps.length - 1) {
      setFormStep(steps[currentIndex + 1])
    }
  }

  const goToPreviousStep = () => {
    const steps: FormStep[] = ['property', 'pool', 'documents', 'review']
    const currentIndex = steps.indexOf(formStep)
    if (currentIndex > 0) {
      setFormStep(steps[currentIndex - 1])
    }
  }

  const generateApplication = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append(
        'message',
        `Process and validate pool permit application with the following data:
Property Information:
- Address: ${property.address}
- Lot Size: ${property.lotSize} acres
- Zoning: ${property.zoning}
- Property Type: ${property.propertyType}

Pool Specifications:
- Type: ${pool.poolType}
- Dimensions: ${pool.length}ft x ${pool.width}ft
- Depth: ${pool.depth}ft
- Heating: ${pool.heating ? `Yes (${pool.heatingType})` : 'No'}
- Lighting: ${pool.lighting ? 'Yes' : 'No'}
- Diving Board: ${pool.divingBoard ? 'Yes' : 'No'}
- Fence: ${pool.fence ? 'Yes' : 'No'}

Documents Uploaded: ${documents.map((d) => d.type).join(', ')}

Please validate all requirements, check document completeness, and generate a structured permit application response.`
      )

      formData.append('agent_id', '68fd263d71c6b27d6c8eb80f')

      const response = await fetch('/api/agent', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.response) {
        const result = data.response?.result || data.response
        setValidationResult(result)
        setScreen('results')
      } else {
        console.error('Failed to generate application:', data)
        alert('Error generating application. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error generating application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const stepProgress = {
    property: 1,
    pool: 2,
    documents: 3,
    review: 4,
  }

  const currentProgress = stepProgress[formStep]

  // Landing Screen
  if (screen === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-2">
              <Droplet className="text-blue-600 w-8 h-8" />
              <h1 className="text-2xl font-bold text-blue-900">PoolPermit</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-16">
          <section className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">Pool Permit Made Simple</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Navigate permit requirements with confidence. Our guided process streamlines documentation, validates completeness, and generates professional permit applications in minutes.
            </p>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-lg"
              onClick={() => setScreen('form')}
            >
              Start Application
            </Button>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                  <Home className="text-blue-600 w-12 h-12" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Guided Process</h3>
                <p className="text-gray-600">
                  Step-by-step guidance through permit requirements with real-time validation and helpful tips.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                  <File className="text-blue-600 w-12 h-12" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Validation</h3>
                <p className="text-gray-600">
                  Upload documents with confidence. Our system validates completeness and flags missing items.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                  <Download className="text-blue-600 w-12 h-12" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Generation</h3>
                <p className="text-gray-600">
                  Get a professionally formatted permit application ready for submission to your local authority.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="mb-20">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h3>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible>
                {FAQ_ITEMS.map((item, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left hover:bg-gray-50 px-4 py-3 rounded">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-3 text-gray-600">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        </main>

        <footer className="bg-gray-900 text-white text-center py-8">
          <p className="text-gray-400">Pool Permit Application Assistant - Simplifying Municipal Compliance</p>
        </footer>
      </div>
    )
  }

  // Form Screen
  if (screen === 'form') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="text-blue-600 w-8 h-8" />
                <h1 className="text-2xl font-bold text-blue-900">PoolPermit</h1>
              </div>
              <div className="text-sm text-gray-600">
                Step {currentProgress} of 4
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-4 gap-2 mb-8">
            {(['property', 'pool', 'documents', 'review'] as FormStep[]).map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    formStep === step
                      ? 'bg-blue-600 text-white'
                      : stepProgress[step] < currentProgress
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepProgress[step] < currentProgress ? '✓' : index + 1}
                </div>
                <div
                  className={`flex-1 h-1 mx-2 ${
                    stepProgress[step] < currentProgress ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Property Info Step */}
          {formStep === 'property' && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-6 h-6 text-blue-600" />
                  Property Information
                </CardTitle>
                <CardDescription>Enter details about your property and location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="address">Property Address</Label>
                  <Input
                    id="address"
                    value={property.address}
                    onChange={(e) => handlePropertyChange('address', e.target.value)}
                    placeholder="123 Oak Street"
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lotSize">Lot Size (acres)</Label>
                    <Input
                      id="lotSize"
                      type="number"
                      step="0.01"
                      value={property.lotSize}
                      onChange={(e) => handlePropertyChange('lotSize', e.target.value)}
                      placeholder="0.5"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="zoning">Zoning Classification</Label>
                    <Select value={property.zoning} onValueChange={(value) => handlePropertyChange('zoning', value)}>
                      <SelectTrigger id="zoning" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ZONING_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Property Type</Label>
                  <RadioGroup value={property.propertyType} onValueChange={(value) => handlePropertyChange('propertyType', value)}>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {PROPERTY_TYPES.map((type) => (
                        <div key={type.value} className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                          <RadioGroupItem value={type.value} id={type.value} />
                          <Label htmlFor={type.value} className="cursor-pointer flex-1">
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pool Specs Step */}
          {formStep === 'pool' && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplet className="w-6 h-6 text-blue-600" />
                  Pool Specifications
                </CardTitle>
                <CardDescription>Provide details about your pool design and features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Pool Type</Label>
                  <RadioGroup value={pool.poolType} onValueChange={(value) => handlePoolChange('poolType', value)}>
                    <div className="flex gap-6 mt-4">
                      {[
                        { value: 'inground', label: 'In-Ground' },
                        { value: 'aboveground', label: 'Above-Ground' },
                      ].map((type) => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={type.value} id={`pool-${type.value}`} />
                          <Label htmlFor={`pool-${type.value}`} className="cursor-pointer">
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="length">Length (feet)</Label>
                    <Input
                      id="length"
                      type="number"
                      value={pool.length}
                      onChange={(e) => handlePoolChange('length', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="width">Width (feet)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={pool.width}
                      onChange={(e) => handlePoolChange('width', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="depth">Depth (feet)</Label>
                    <Input
                      id="depth"
                      type="number"
                      value={pool.depth}
                      onChange={(e) => handlePoolChange('depth', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Pool Features</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 border rounded-lg p-3">
                      <Checkbox
                        id="heating"
                        checked={pool.heating}
                        onCheckedChange={(checked) => handlePoolChange('heating', !!checked)}
                      />
                      <Label htmlFor="heating" className="flex-1 cursor-pointer">
                        Heating System
                      </Label>
                    </div>

                    {pool.heating && (
                      <div className="ml-6">
                        <Label htmlFor="heatingType" className="text-sm">
                          Heating Type
                        </Label>
                        <Select value={pool.heatingType} onValueChange={(value) => handlePoolChange('heatingType', value)}>
                          <SelectTrigger id="heatingType" className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gas">Gas</SelectItem>
                            <SelectItem value="electric">Electric</SelectItem>
                            <SelectItem value="solar">Solar</SelectItem>
                            <SelectItem value="heat-pump">Heat Pump</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 border rounded-lg p-3">
                      <Checkbox
                        id="lighting"
                        checked={pool.lighting}
                        onCheckedChange={(checked) => handlePoolChange('lighting', !!checked)}
                      />
                      <Label htmlFor="lighting" className="flex-1 cursor-pointer">
                        LED Lighting
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 border rounded-lg p-3">
                      <Checkbox
                        id="divingBoard"
                        checked={pool.divingBoard}
                        onCheckedChange={(checked) => handlePoolChange('divingBoard', !!checked)}
                      />
                      <Label htmlFor="divingBoard" className="flex-1 cursor-pointer">
                        Diving Board
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 border rounded-lg p-3">
                      <Checkbox
                        id="fence"
                        checked={pool.fence}
                        onCheckedChange={(checked) => handlePoolChange('fence', !!checked)}
                      />
                      <Label htmlFor="fence" className="flex-1 cursor-pointer">
                        Security Fence (Required for residential)
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents Step */}
          {formStep === 'documents' && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="w-6 h-6 text-blue-600" />
                  Supporting Documents
                </CardTitle>
                <CardDescription>Upload required documentation (PDF or image files, max 10MB each)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {['Property Deed', 'Site Plan', 'Pool Design'].map((docType) => {
                  const uploadedDoc = documents.find((d) => d.type === docType)
                  return (
                    <div key={docType}>
                      <Label className="text-base font-medium mb-3 block">{docType}</Label>
                      {uploadedDoc ? (
                        <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="text-green-600 w-5 h-5" />
                              <div>
                                <p className="font-medium text-gray-900">{uploadedDoc.name}</p>
                                <p className="text-sm text-gray-500">Uploaded successfully</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(uploadedDoc.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          {uploadedDoc.preview && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewOpen(true)}
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Preview
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, docType)}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                          onClick={() => {
                            fileInputRef.current?.click()
                          }}
                        >
                          <FileUp className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                          <p className="font-medium text-gray-700 mb-1">Drag and drop your file here</p>
                          <p className="text-sm text-gray-500 mb-3">or click to browse</p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => handleDocumentUpload(e, docType)}
                            accept=".pdf,.png,.jpg,.jpeg"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}

                {documents.length > 0 && documents.length < 3 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="text-yellow-600 h-4 w-4" />
                    <AlertTitle className="text-yellow-800">Missing Documents</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      You have uploaded {documents.length} of 3 required documents. Please upload all documents to proceed.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Review Step */}
          {formStep === 'review' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-6 h-6 text-blue-600" />
                    Property Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium">{property.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Lot Size</p>
                      <p className="font-medium">{property.lotSize} acres</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Zoning</p>
                      <p className="font-medium capitalize">{property.zoning}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Property Type</p>
                      <p className="font-medium capitalize">{property.propertyType}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormStep('property')}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplet className="w-6 h-6 text-blue-600" />
                    Pool Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium capitalize">{pool.poolType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dimensions</p>
                      <p className="font-medium">
                        {pool.length} x {pool.width} ft
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Depth</p>
                      <p className="font-medium">{pool.depth} ft</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Features</p>
                    <div className="flex flex-wrap gap-2">
                      {pool.heating && <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Heating ({pool.heatingType})</span>}
                      {pool.lighting && <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Lighting</span>}
                      {pool.divingBoard && <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Diving Board</span>}
                      {pool.fence && <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Fence</span>}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormStep('pool')}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <File className="w-6 h-6 text-blue-600" />
                    Documents ({documents.length}/3)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-600 w-5 h-5" />
                            <div>
                              <p className="font-medium text-sm">{doc.type}</p>
                              <p className="text-xs text-gray-500">{doc.name}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No documents uploaded</p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormStep('documents')}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {formStep !== 'property' && (
              <Button variant="outline" onClick={goToPreviousStep}>
                Previous
              </Button>
            )}

            {formStep === 'review' ? (
              <Button
                onClick={generateApplication}
                disabled={loading}
                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Application
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={goToNextStep}
                disabled={!validateStep()}
                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Image Preview Dialog */}
        {previewOpen && documents.length > 0 && (
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Document Preview</DialogTitle>
                <DialogDescription>Preview of uploaded document</DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                {documents[0].preview && (
                  <img
                    src={documents[0].preview}
                    alt="Document preview"
                    className="w-full h-auto rounded-lg"
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

  // Results Screen
  if (screen === 'results') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-2">
              <Droplet className="text-blue-600 w-8 h-8" />
              <h1 className="text-2xl font-bold text-blue-900">PoolPermit</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-12">
          {validationResult && (
            <div className="space-y-8">
              <div
                className={`rounded-lg p-8 text-center ${
                  validationResult.validation_status === 'complete'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div className="flex justify-center mb-4">
                  {validationResult.validation_status === 'complete' ? (
                    <CheckCircle className="text-green-600 w-16 h-16" />
                  ) : (
                    <AlertCircle className="text-yellow-600 w-16 h-16" />
                  )}
                </div>
                <h2
                  className={`text-3xl font-bold mb-2 ${
                    validationResult.validation_status === 'complete'
                      ? 'text-green-900'
                      : 'text-yellow-900'
                  }`}
                >
                  {validationResult.validation_status === 'complete'
                    ? 'Application Ready'
                    : 'Additional Items Needed'}
                </h2>
                <p
                  className={`text-lg ${
                    validationResult.validation_status === 'complete'
                      ? 'text-green-700'
                      : 'text-yellow-700'
                  }`}
                >
                  {validationResult.validation_status === 'complete'
                    ? 'Your permit application has been successfully generated and is ready for download.'
                    : 'Please provide the following items to complete your application.'}
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Validation Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {validationResult.validation_checklist.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                        <div className="flex-shrink-0 pt-1">
                          {item.status === 'pass' ? (
                            <CheckCircle className="text-green-600 w-5 h-5" />
                          ) : (
                            <AlertCircle className="text-red-600 w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.item}</p>
                          {item.details && <p className="text-sm text-gray-600 mt-1">{item.details}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {validationResult.missing_items.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="text-red-600" />
                  <AlertTitle className="text-red-900">Missing Items</AlertTitle>
                  <AlertDescription className="text-red-800 mt-2">
                    <ul className="list-disc list-inside space-y-1">
                      {validationResult.missing_items.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.compliance_notes.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Compliance Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {validationResult.compliance_notes.map((note, index) => (
                        <li key={index} className="flex gap-2 text-blue-900">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Property & Pool Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Property Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600">Address</p>
                      <p className="font-medium">{validationResult.property_summary.address}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Lot Size</p>
                      <p className="font-medium">{validationResult.property_summary.lotSize} acres</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Zoning</p>
                      <p className="font-medium capitalize">{validationResult.property_summary.zoning}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pool Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600">Type & Dimensions</p>
                      <p className="font-medium capitalize">
                        {validationResult.pool_summary.poolType} ({validationResult.pool_summary.length}x{validationResult.pool_summary.width}
                        ft)
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Depth</p>
                      <p className="font-medium">{validationResult.pool_summary.depth} ft</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Key Features</p>
                      <p className="font-medium">
                        {[
                          validationResult.pool_summary.fence && 'Fence',
                          validationResult.pool_summary.heating && 'Heating',
                          validationResult.pool_summary.lighting && 'Lighting',
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setScreen('form')
                    setFormStep('property')
                  }}
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Application
                </Button>

                {validationResult.validation_status === 'complete' && (
                  <Button
                    onClick={() => {
                      const content = `
POOL PERMIT APPLICATION

APPLICANT INFORMATION
Address: ${validationResult.property_summary.address}
Property Type: ${validationResult.property_summary.propertyType}
Lot Size: ${validationResult.property_summary.lotSize} acres
Zoning: ${validationResult.property_summary.zoning}

POOL SPECIFICATIONS
Type: ${validationResult.pool_summary.poolType}
Dimensions: ${validationResult.pool_summary.length}ft x ${validationResult.pool_summary.width}ft
Depth: ${validationResult.pool_summary.depth}ft

SAFETY & FEATURES
- Fence: ${validationResult.pool_summary.fence ? 'Yes' : 'No'}
- Heating: ${validationResult.pool_summary.heating ? `Yes (${validationResult.pool_summary.heatingType})` : 'No'}
- Lighting: ${validationResult.pool_summary.lighting ? 'Yes' : 'No'}
- Diving Board: ${validationResult.pool_summary.divingBoard ? 'Yes' : 'No'}

VALIDATION STATUS
Overall Status: APPROVED
Items Validated: ${validationResult.validation_checklist.length}
Date Generated: ${new Date().toLocaleDateString()}

COMPLIANCE REQUIREMENTS
${validationResult.compliance_notes.map((note) => `- ${note}`).join('\n')}

This application is ready for submission to the local authority.
                      `
                      const blob = new Blob([content], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'pool_permit_application.txt'
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="ml-auto gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4" />
                    Download Application
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setScreen('landing')
                    setFormStep('property')
                    setValidationResult(null)
                  }}
                >
                  Start New Application
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  return null
}
