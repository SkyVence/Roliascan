"use client"

import type { UseFormReturn } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2 } from "lucide-react"
import { useFieldArray } from "react-hook-form"

interface BasicInfoFormProps {
  form: UseFormReturn<any>
}

export default function BasicInfoForm({ form }: BasicInfoFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "basicInfo.links",
  })

  return (
    <div className="space-y-4">
      <Form {...form}>
        <FormField
          control={form.control}
          name="basicInfo.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title name*</FormLabel>
              <FormControl>
                <Input placeholder="Enter title name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="basicInfo.description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter a description" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            control={form.control}
            name="basicInfo.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manga">Manga</SelectItem>
                    <SelectItem value="manhwa">Manhwa</SelectItem>
                    <SelectItem value="manhua">Manhua</SelectItem>
                    <SelectItem value="comic">Comic</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="basicInfo.status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="hiatus">Hiatus</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-6">
          <FormLabel className="block mb-2">Links (optional)</FormLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2 mb-2">
              <FormField
                control={form.control}
                name={`basicInfo.links.${index}.type`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Link type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="official">Official</SelectItem>
                        <SelectItem value="amazon">Amazon</SelectItem>
                        <SelectItem value="mangadex">MangaDex</SelectItem>
                        <SelectItem value="anilist">AniList</SelectItem>
                        <SelectItem value="myanimelist">MyAnimeList</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`basicInfo.links.${index}.url`}
                render={({ field }) => (
                  <FormItem className="flex-[2]">
                    <FormControl>
                      <Input placeholder="Enter URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append({ type: "official", url: "" })}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add Link
          </Button>
        </div>
      </Form>
    </div>
  )
}
