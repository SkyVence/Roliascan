"use client"

import { useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Combobox } from "./combobox"
import { PlusCircle, Trash2 } from "lucide-react"


interface AuthorInfoFormProps {
  form: UseFormReturn<any>
  authors: {
    id: string
    name: string
    description: string | null
    socials: {
      type: string
      url: string
    }[]
  }[]
}

export default function AuthorInfoForm({ form, authors }: AuthorInfoFormProps) {
  const [socialLinks, setSocialLinks] = useState<{ type: string; url: string }[]>(
    form.getValues("newAuthor.links") || [],
  )

  const addSocialLink = () => {
    const newLinks = [...socialLinks, { type: "", url: "" }]
    setSocialLinks(newLinks)
    form.setValue("newAuthor.links", newLinks, { shouldValidate: true })
  }

  const removeSocialLink = (index: number) => {
    const newLinks = socialLinks.filter((_, i) => i !== index)
    setSocialLinks(newLinks)
    form.setValue("newAuthor.links", newLinks, { shouldValidate: true })
  }

  const updateSocialLink = (index: number, field: "type" | "url", value: string) => {
    const newLinks = [...socialLinks]
    newLinks[index][field] = value
    setSocialLinks(newLinks)
    form.setValue("newAuthor.links", newLinks, { shouldValidate: true })
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <FormField
          control={form.control}
          name="authorInfo.authorOption"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Author Information</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="existing" />
                    </FormControl>
                    <FormLabel className="font-normal">Look for existing author</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="new" />
                    </FormControl>
                    <FormLabel className="font-normal">Create a new author</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("authorInfo.authorOption") === "existing" ? (
          <FormField
            control={form.control}
            name="authorInfo.existingAuthor"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Select Author</FormLabel>
                <FormControl>
                  <Combobox
                    options={authors.map((author) => ({
                      label: author.name,
                      value: author.id,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search for an author..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="authorInfo.newAuthor.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter author name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authorInfo.newAuthor.description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter author description" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel>Social Media Links</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="h-8">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>

              {socialLinks.map((link, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <FormLabel className="text-xs">Platform</FormLabel>
                    <Input
                      placeholder="Twitter, Instagram, etc."
                      value={link.type}
                      onChange={(e) => updateSocialLink(index, "type", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-[2]">
                    <FormLabel className="text-xs">URL</FormLabel>
                    <Input
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSocialLink(index)}
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Form>
    </div>
  )
}
